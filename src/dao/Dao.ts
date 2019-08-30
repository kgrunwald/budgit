import Parse from '../models/Parse';

interface DaoOptions {
  useMasterKey?: boolean;
  sessionToken?: string;
}

abstract class Dao {
  protected abstract clazz: typeof Parse.Object;

  constructor(private opts: DaoOptions) {}

  public setSessionToken(sessionToken: string) {
    this.opts.sessionToken = sessionToken;
  }

  protected get(id: string) {
    return this.query.includeAll().get(id, this.opts);
  }

  protected async getOrCreate(field: string, id: string) {
    let obj = await this.first(field, id);
    if (!obj) {
      obj = new this.clazz();
    }
    return obj;
  }

  protected all() {
    return this.query.includeAll().find(this.opts);
  }

  protected find(key: string, value: any) {
    return this.query
      .equalTo(key, value)
      .includeAll()
      .find(this.opts);
  }

  protected first(key: string, value: any) {
    return this.query
      .equalTo(key, value)
      .includeAll()
      .first(this.opts);
  }

  protected get query() {
    return new Parse.Query(this.clazz);
  }
}

export default Dao;
