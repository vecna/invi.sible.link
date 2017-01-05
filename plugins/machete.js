/* machete plugins are smaller, so are contained in a single file */
var _ = require('lodash');
var debug = require('debug')('plugins:machete');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

function mongoGetter(logic) {
    return mongo
        .read(nconf.get('schema').subjects, logic.chain.filter)
		.then(_.first)
        .then(function(S) {
            debug("With filter %j I'v %d subjects",
				logic.chain.filter, _.size(S.pages));
			return {
				logic: logic,
				S: S
			};
		});
}

/*
	 { rank: 123,
       href: 'http://pciconcursos.com.br',
       domain: 'pciconcursos.com.br',
       description: 'Informações sobre concursos públicos e seleção com base em análise de currículos... (length: 129)',
       domainId: 'ec1be9928b2cfa0f2498b682cca902ba566a1bba',
       id: '961f59b79142ebb6a4aa692f0ad3d46237e0abd4' },
     { rank: 124,
       href: 'http://infojobs.com.br',
       domain: 'infojobs.com.br',
       description: 'Procura empregos no site com mais vagas de emprego. Cadastre seu Currículo gráti... (length: 144)',
       domainId: '303cba46222b0b302092e429ef40067cfb06c50e',
       id: '008eeca38e194d1be7445d06331d46c44a81e3c4' },
     ... 72 more items ],
  source: 'Initialization subjects for invi.sible.link',
  public: true,
  name: 'Brazil',
  kind: 'country',
  iso3166: 'BR',
  population: 201103330,
  creationTime: 2016-12-12T17:48:54.929Z,
  trueOn: 2016-03-17T00:00:00.000Z,
  subjectId: 'eea880a6836d9abae98972be4f2acb84883da92b',
  id: 'ddd843b644ef6115cbcd4afaf06ad73f496537fb' }
 */

/*
 * This function pick subjectId(s) and create an API call base URL
 * that looks like http://$VP:7300/api/v1/$subjectId/7/BSL (last 7 days) */
function bySubjectLast7(logic) {
    return mongoGetter(logic)
        .then(function(content) {
			var retVal = content.logic;
			retVal.init = _.map(content.S.pages, function(p) {
				return p.id;
			});
			debug("bySubjectLast7 tooks %d IDs", _.size(retVal.init));
			return retVal;
        });
};

module.exports = {
    bySubjectLast7: bySubjectLast7,
};
