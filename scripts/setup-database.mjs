import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {publicConfig} from '../server.mjs';

async function hiddenPassword() {
  if(!process.stdin.isTTY) throw new Error('Execute este comando em um terminal interativo para informar a senha sem exibi-la.');
  process.stdout.write('Senha do banco (entrada oculta): ');
  process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
  return new Promise((resolve,reject)=>{
    let input='';
    const done=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');};
    const onData=chunk=>{for(const c of chunk){if(c==='\u0003'){done();reject(new Error('Operação cancelada.'));return;}if(c==='\r'||c==='\n'){done();resolve(input);return;}if(c==='\u007f'||c==='\b')input=input.slice(0,-1);else input+=c;}};
    process.stdin.on('data',onData);
  });
}
let client;
try {
  const config=publicConfig();
  const ref=new URL(config.supabaseUrl).hostname.split('.')[0];
  const host=process.env.SUPABASE_DB_HOST || `db.${ref}.supabase.co`;
  if(!/^(db\.[a-z0-9-]+\.supabase\.co|[a-z0-9-]+\.pooler\.supabase\.com)$/.test(host))throw new Error('Use o hostname de banco fornecido pelo painel Supabase.');
  const ca=await readFile(process.env.SUPABASE_DB_CA_FILE || new URL('../supabase/prod-ca-2021.crt',import.meta.url),'utf8');
  const password=await hiddenPassword();
  client=new pg.Client({host,port:5432,database:'postgres',user:host.endsWith('.pooler.supabase.com')?`postgres.${ref}`:'postgres',password,ssl:{rejectUnauthorized:true,...(ca?{ca}:{})},connectionTimeoutMillis:15000,query_timeout:15000});
  await client.connect();
  await client.query('begin');
  try {
    await client.query(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
    const check=await client.query("select relrowsecurity from pg_class where oid='public.study_progress'::regclass");
    if(!check.rows[0]?.relrowsecurity)throw new Error('Não foi possível confirmar as políticas de segurança.');
    await client.query('commit');
    console.log('Tabela study_progress criada; RLS habilitada e políticas por usuário aplicadas.');
  } catch(e) {await client.query('rollback');throw e;}
} catch(e) {
  const messages={ENETUNREACH:'A conexão direta IPv6 não está acessível. Configure SUPABASE_DB_HOST com o Session pooler fornecido pelo painel Supabase.',ENOTFOUND:'Hostname do banco não encontrado. Confira o endereço de conexão no painel Supabase.',SELF_SIGNED_CERT_IN_CHAIN:'O banco exige seu certificado CA. Configure SUPABASE_DB_CA_FILE com o certificado baixado do painel.',DEPTH_ZERO_SELF_SIGNED_CERT:'O banco exige seu certificado CA. Configure SUPABASE_DB_CA_FILE com o certificado baixado do painel.', '28P01':'Senha do banco recusada.'};
  console.error(messages[e.code] || 'Não foi possível concluir a configuração do banco. Confira o host, a senha e o certificado no painel. Nenhuma credencial foi registrada.');
  process.exitCode=1;
} finally {if(client)await client.end().catch(()=>{});}
