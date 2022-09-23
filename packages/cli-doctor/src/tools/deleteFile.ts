import {unlink} from 'fs';
import {promisify} from 'util';

export const deleteFile = promisify(unlink);
