
### Commands sequence to test the workflow




    aaѪaa:~/Dev/invi.sible.link$ DEBUG=* bin/directionTool.js --csv campaigns/example/example.csv --taskName example

    aaѪaa:~/Dev/invi.sible.link$ npm run vigile
    aaѪaa:~/Dev/invi.sible.link$ npm run exposer

Ok, ISL-schedule has some hardcoded path I've to fix, check `oo` `aa`

    aaѪaa:~/Dev/invi.sible.link$ bin/ISL-scheduled --task chopsticks 
    aaѪaa:~/Dev/invi.sible.link$ bin/ISL-scheduled --task chopsticks
    aaѪaa:~/Dev/invi.sible.link$ bin/ISL-scheduled --task chopsticks

vigile output:

		0.0.0.0:7200 listening
		vigile initial check: Promises are 5 +0ms
		route:getTasks Ј getTasks max 2 from casa +3m
		route:getTasks taskList returns 2 tasks updated for VP [casa] +90ms
		lib:sharedExpress Minute callback has found accessLog in queue (3) +37s
		lib:various Flushing 3 collected accesses +1ms
		route:getTasks Υ getTasks max 2 from casa +3m
		route:getTasks taskList returns 2 tasks updated for VP [casa] +26ms
		lib:sharedExpress Minute callback has found accessLog in queue (1) +18s
		lib:various Flushing 1 collected accesses +0ms
		route:getTasks ܺ getTasks max 2 from casa +18s
		route:getTasks taskList returns 1 tasks updated for VP [casa] +24ms
		lib:sharedExpress Minute callback has found accessLog in queue (4) +42s
		lib:various Flushing 4 collected accesses +1ms

		aaѪaa:~/Dev/invi.sible.link$ DEBUG=* bin/campaignChecker.js --config config/experimentsCampaign.json --campaign example


