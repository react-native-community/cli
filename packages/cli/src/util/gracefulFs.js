import realFs from 'fs';
import gracefulFs from 'graceful-fs';

gracefulFs.gracefulify(realFs);

export default gracefulFs;
