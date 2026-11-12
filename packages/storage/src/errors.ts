/**
 * @file 定义持久化流程的错误码常量，供 persist 与各存储后端统一引用以做错误分类。
 */

/**
 * 持久化相关错误的字符串码集合，作为错误对象的分类标识。
 * 设计为 `as const` 对象而非 enum：值即字符串字面量，便于跨模块比较、序列化并派生联合类型。
 */
export const PERSIST_ERROR_CODE = {
  /** 从底层存储读取数据时失败的错误码。 */
  StorageReadFailed: "StorageReadFailed",
  /** 向底层存储写入数据时失败的错误码。 */
  StorageWriteFailed: "StorageWriteFailed",
  /** 将内存值序列化为持久化字符串时失败的错误码。 */
  SerializationFailed: "SerializationFailed",
  /** 将持久化字符串反序列化为内存值时失败的错误码。 */
  DeserializationFailed: "DeserializationFailed",
  /** 数据版本迁移执行失败的错误码。 */
  MigrationFailed: "MigrationFailed",
} as const;
