import dns from 'dns';

console.log("Setting DNS server to 8.8.8.8...");
dns.setServers(['8.8.8.8']);

console.log("Testing SRV resolution...");
dns.resolveSrv('_mongodb._tcp.deardiary.jcushvp.mongodb.net', (err, addresses) => {
  console.log('deardiary SRV:', err, addresses);
  dns.resolveSrv('_mongodb._tcp.diary.93vu2m6.mongodb.net', (err, addresses2) => {
    console.log('diary SRV:', err, addresses2);
    process.exit(0);
  });
});
