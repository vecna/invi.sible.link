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

`getSurface`:
    `surface`: by campaign name and hours, (social-pressure, storyteller)

`getCSV`:
    `surface`: by campaign name and hours, in CSV format reduce for Tableau, (social-pressure, storyteller)

`getEvidencesByName`:
    `evidences` by campaign name and pick just last hours (social-pressure)

`getEvidencesByPromise`:
    `evidences` by promiseId (storyteller)

`getRaw`:
    **any kind of column can be requested**, only the last 24 hours are returned (storyteller)

`getRetrieved`:
    **any kind of column can be requested**, only one `id` can be specify (exposer)

`getStats`:
    `statistics`, return some other OS non repetible data (exposer, social-pressure, storyteller)

`getSubjectsStats`:
    `subjects`: it is became a statistics only tool, it return by campaign/day, the subjects and few numeric breakdown from the entries stored in the last # days. (social-pressure, storyteller)

`getTasks`:
    `promises`: from a dateTime, in between `start` and `end` (vigile)

`systemInfo`:
    **all the columns**, and systemInfo (social-pressure)

`getCampaignNames`:
    It read from `config/campaignChecker.json`

`getStatsByHref`:
    `surfaces` return the number of tests available in the last 30 days and their IDs, by `domaindottld`

`getEvidencesByHref`:
    `evidences` return last 7days of evidences by `domaindottld` (target and third party) capped to 7k

 getTableauJSON:
    `evidences` return last day, query by campaignName, content ready for experiments in Tableau
