var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('lib:spawnCommand');
var spawn = require('child_process').spawn;

var spawnCommand = function(command, msTimeout) {

    if(_.isUndefined(msTimeout))
        msTimeout = 1000;

    debug("Executing %j [max ms %d] from %s", command, msTimeout, process.cwd());
    return new Promise(function(resolve, reject) {
        var M = spawn(command.binary,
                      command.args,
                    { env: command.environment } );

        M.stdout.on('data', function(data) {
            debug("Output: %s", data);
        });

        M.stderr.on('data', function(data) {
            debug("Error: %s", data);
        });

        M.on('close', (code) => {
            debug("Command (%s) exited with code %d", command.binary, code);
            return resolve();
        });

        M.on('exit', function(code) {
            if (code && code.error) {
                debug("Exit (with Error) %j", code);
                return reject();
            } else {
                return resolve();
            }
        });
    })
    .timeout(msTimeout);
};

module.exports = spawnCommand;
