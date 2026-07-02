import dns from 'dns';

console.log("Testing DNS resolution...");
dns.lookup('google.com', (err, address, family) => {
  console.log('google.com:', err, address, family);
  dns.resolveSrv('_mongodb._tcp.deardiary.jcushvp.mongodb.net', (err, addresses) => {
    console.log('_mongodb._tcp.deardiary.jcushvp.mongodb.net SRV:', err, addresses);
    dns.resolveSrv('_mongodb._tcp.diary.93vu2m6.mongodb.net', (err, addresses2) => {
      console.log('_mongodb._tcp.diary.93vu2m6.mongodb.net SRV:', err, addresses2);
      process.exit(0);
    });
  });
});
