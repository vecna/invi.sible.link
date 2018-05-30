## Config on the probe

Do a copy of chopsticks.conf in a file used by your vantage point, in my case, HK.json

This is the original
```
{
  "name": "chopsticks",
  "VP": "IVL",
  "source": "http://localhost:7200",
  "schema": {
    "phantom": "phantom",
    "badger": "badger"
  },
  "amount": 2,
  "concurrency": 1,
  "mongodb": "mongodb://localhost/chopsticks"
}
```

you should change:

`VP`: with a name attributed to your vantage point (in my case, 'HK')
`source`: the server in which `npm run vigile` is running 

## Crontab on the probe

	*/2 * * * * cd invi.sible.link/bin ; config='config/HK-config.json' npm run badger >> /tmp/badger.log 2>&1 ; config='config/HK-config.json' npm run phantom >> /tmp/phantom.log 2>&1
	0 20 * * * cd invi.sible.link ; node bin/autocleaner.js
	*/5 * * * * cd invi.sible.link && bin/statusChecker.js
