import http from './http';

export default {
  // Public API
  fetch: () => {
    let url = `${document.location.origin}/api/history`;
    return http.get(url);
  }
}
