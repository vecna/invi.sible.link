import _ from 'lodash';
import Promise from 'bluebird';
import request from 'request';

Promise.promisifyAll(request);

const get = (url) =>
  request.getAsync({uri: url, json: true}).then(response => response.body);

const post = (url, data) =>
  request.postAsync(_.merge({uri: url, json: true}, data ? {body: data} : null))
         .then(response => response.body);

const put = (url, data) => {
  return request.putAsync(_.merge({uri: url, json: true}, data ? {body: data} : null))
         .then(response => response.body);
  }

const remove = (url) =>
  request.delAsync({uri: url, json: true});

export default {
  get: get,
  post: post,
  put: put,
  del: remove
}
