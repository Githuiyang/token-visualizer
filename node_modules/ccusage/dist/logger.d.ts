import * as consola0 from "consola";

//#region src/logger.d.ts

/**
 * @fileoverview Logging utilities for the ccusage application
 *
 * This module provides configured logger instances using consola for consistent
 * logging throughout the application with package name tagging.
 *
 * @module logger
 */
/**
 * Application logger instance with package name tag
 */
declare const logger: consola0.ConsolaInstance;
/**
 * Direct console.log function for cases where logger formatting is not desired
 */
declare const log: {
  (...data: any[]): void;
  (message?: any, ...optionalParams: any[]): void;
};
//#endregion
export { log, logger };