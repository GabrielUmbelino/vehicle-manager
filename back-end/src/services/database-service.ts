import { Model, PersistedModel } from "@vehicle-manager/api";

import Database from "nedb";
import { BaseCrudService, EntityNotFoundError } from "./service";

export abstract class DatabaseCrudService<T extends Model> extends BaseCrudService<T> {
  constructor(private db: Database<T>) {
    super();
  }

  public async create(...[rawData]: Parameters<BaseCrudService<T>["create"]>):
    ReturnType<BaseCrudService<T>["create"]> {

    const data = await this.beforeCreate(rawData);

    return new Promise((resolve, reject) => {

      this.db.insert(data, async (err, doc) => {
        const entity = doc as PersistedModel<T>;
        this.afterCreate(entity);
        resolve(entity);
      });

    });
  }

  public async read(...[id]: Parameters<BaseCrudService<T>["read"]>): ReturnType<BaseCrudService<T>["read"]> {
    return new Promise((resolve, reject) => {

      this.db.findOne({ _id: id }, async (err, doc) => {
        if (!doc) {
          reject(new EntityNotFoundError());
        }
        const entity = doc as PersistedModel<T>;
        resolve(entity);
      });

    });
  }

  public async find(query: any): Promise<Array<PersistedModel<T>>> {

    return new Promise((resolve) => {

      this.db.find(query, (err, docs) => {
        resolve(docs as Array<PersistedModel<T>>);
      });

    });
  }

  public async update(...[id, rawData]: Parameters<BaseCrudService<T>["update"]>): ReturnType<BaseCrudService<T>["update"]> {
    const before = await this.read(id);

    const data = await this.beforeUpdate(before, rawData);

    return new Promise((resolve, reject) => {

      this.db.update({ _id: id }, data, {}, async (err) => {
        this.afterUpdate(before, data);
        resolve({ ...before, ...data });
      });

    });

  }

  public async delete(...[id]: Parameters<BaseCrudService<T>["delete"]>): ReturnType<BaseCrudService<T>["delete"]> {
    const entity = await this.read(id);

    await this.beforeDelete(entity);

    return new Promise(async (resolve, reject) => {

      this.db.remove({ _id: id }, {}, async (err) => {
        await this.afterDelete(entity);
        resolve(entity);
      });

    });
  }
}
