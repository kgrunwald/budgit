import Parse from './Parse';

export class User extends Parse.User {
  constructor(attributes: any) {
    super(attributes);
  }

  get email(): string {
    return this.get('email');
  }

  set email(email: string) {
    this.set('email', email);
  }

  get username(): string {
    return this.get('username');
  }

  set username(username: string) {
    this.set('username', username);
  }

  get password(): string {
    return this.get('password');
  }

  set password(password: string) {
    this.set('password', password);
  }

  get firstName(): string {
    return this.get('firstName');
  }

  set firstName(firstName: string) {
    this.set('firstName', firstName);
  }

  get lastName(): string {
    return this.get('lastName');
  }

  set lastName(lastName: string) {
    this.set('lastName', lastName);
  }
}

Parse.Object.registerSubclass('_User', User);
export default User;
