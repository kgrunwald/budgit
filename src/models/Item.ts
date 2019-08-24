import Parse from './Parse';
import PrivateModel from './PrivateModel';
import User from './User';

class Item extends PrivateModel {
  constructor() {
    super('Item');
  }

  get accessToken(): string {
    return this.get('accessToken');
  }

  set accessToken(token: string) {
    this.set('accessToken', token);
  }

  get itemId(): string {
    return this.get('itemId');
  }

  set itemId(id: string) {
    this.set('itemId', id);
  }

  get user(): User {
    return this.get('user');
  }

  set user(user: User) {
    this.set('user', user);
  }
}

Parse.Object.registerSubclass('Item', Item);
export default Item;
