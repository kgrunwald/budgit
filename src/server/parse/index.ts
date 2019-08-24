import Parse from 'parse/node';

export default (appId: string, key: string, url: string) => {
  Parse.initialize(appId, '', key);
  Parse.serverURL = url;
};
