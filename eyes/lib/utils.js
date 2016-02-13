import moment from 'moment';

export const formatDate = (date) =>
  moment(date).format("ddd, MMM Do YYYY, h:mm:ss a");
