import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * 檢查陣列物件欄位是否含有重複值
 */
export function ArrayObjDistinct(
  field: string,
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string): void => {
    registerDecorator({
      name: 'ArrayDistinct',
      target: object.constructor,
      propertyName,
      constraints: [field],
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (Array.isArray(value)) {
            const distinct = [...new Set(value.map((v): any => v[field]))];
            return distinct.length === value.length;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not contains duplicate entry for ${args.constraints[0]}`;
        },
      },
    });
  };
}

/**
 * 檢查陣列是否含有重複值
 */
export function ArrayDistinct(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string): void => {
    registerDecorator({
      name: 'ArrayDistinct',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (Array.isArray(value)) {
            const distinct = [...new Set(value.map((v): any => v))];
            return distinct.length === value.length;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must not contains duplicate`;
        },
      },
    });
  };
}
