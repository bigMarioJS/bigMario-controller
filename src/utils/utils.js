import { outletNames } from '../const'

import Logger from './Logger';
const logger = new Logger();



export const checkResults = (currentReading, toBe, previousReading) => {

    if (toBe === 'GREATER_THAN') {
      return currentReading > previousReading
    }

    if (toBe === "LESS_THAN") {
      return currentReading < previousReading
    }
  }

  export const exitApp = (msg) => {
    logger.error('Exiting app exit code 1: ${meg}');
    process.exit(1);
  }