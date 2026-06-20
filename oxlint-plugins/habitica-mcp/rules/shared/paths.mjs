export const sourcePath = (filename) => /\/src\//.test(filename);

export const toolPath = (filename) => /\/src\/tools\//.test(filename);

export const habiticaBoundaryPath = (filename) => /\/src\/habitica\//.test(filename);

export const adapterPath = (filename) => /\/src\/habitica\/.*Adapter\.ts$/.test(filename);
