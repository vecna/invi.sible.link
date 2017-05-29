## Routes 


`promises`:
    `activeTasks`, grouped by day, to be stabilized (social-pressure, storyteller)

`byPromise`:
    `phantom`: by `promiseId` (exposer)

`bySubjectLast`:
    `phantom`: by `subjectId` (exposer)

`doneTask`:
    `promises`: by `vantagePoint` and `promiseId` (vigile)

`getCampaignPromises`:
    `promises`: by `taskName` (social-pressure)

`getCampaignSubject`:
    `subjects`: by `iso3166` or `name` based on the API input; it checks if is two letter code or not (storyteller)

`getCompanies`:
    `surface`, last (argument specify) hours, (social-pressure, storyteller)

`getRanked`:
    `evidences` last 36 hours in absolute (social-pressure, storyteller)

`getSurface`:
    `surface`: by campaign name and hours, (social-pressure, storyteller)

`getRaw`:
    **any kind of column can be requested**, only the last 24 hours are returned (storyteller)

`getRetrieved`:
    **any kind of column can be requested**, only one `id` can be specify (exposer)

`getStats`:
    `statistics`, return some other OS non repetible data (exposer, social-pressure, storyteller)

`getSubjects`:
    `subjects`: by name, only if `public: true` (social-pressure, storyteller)

`getTasks`:
    `promises`: from a dateTime, in between `start` and `end` (vigile)

`systemInfo`:
    **all the columns**, and systemInfo (social-pressure)

`getCampaignNames`:
    It read from `config/campaignChecker.json`


