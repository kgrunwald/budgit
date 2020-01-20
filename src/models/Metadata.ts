import 'reflect-metadata';

const FIELDS_KEY = 'fields';

interface Iterable {
    forEach(x: object): void;
}

export function field(target: object, propertyKey: string) {
    const fields =
        Reflect.getMetadata(
            FIELDS_KEY + target.constructor.name,
            target.constructor
        ) || [];
    fields.push(propertyKey);
    Reflect.defineMetadata(
        FIELDS_KEY + target.constructor.name,
        fields,
        target.constructor
    );
}

export function objectToClass<T extends object>(
    clazz: new () => T,
    source: object
): T {
    const fields = Reflect.getMetadata(FIELDS_KEY + clazz.name, clazz);
    const obj = new clazz();
    fields.forEach((f: string) => {
        const val = Reflect.get(source, f);
        Reflect.set(obj, f, val);
    });
    return obj;
}

export function objectsToClassArray<T extends object>(
    clazz: new () => T,
    sources: Iterable
): T[] {
    const arr: T[] = [];
    sources.forEach((source: object) => {
        arr.push(objectToClass(clazz, source));
    });

    return arr;
}

export function classToObject(source: object): object {
    const fields =
        Reflect.getMetadata(
            FIELDS_KEY + source.constructor.name,
            source.constructor
        ) || [];
    const obj = {};
    fields.forEach((f: string) => {
        const val = Reflect.get(source, f);
        if (val !== undefined) {
            Reflect.set(obj, f, val);
        }
    });
    return obj;
}
