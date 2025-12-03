import { generateUUID } from '../shared/uuid';

export abstract class Entity {
  protected constructor(protected readonly _uuid: string) {}

  get uuid(): string {
    return this._uuid!;
  }

  equals(other: Entity): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._uuid === other._uuid;
  }

  protected static generateUUID(): string {
    return generateUUID();
  }
}
