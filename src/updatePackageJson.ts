import fs from 'node:fs';

export const updatePackageJson = async (name: string): Promise<void> => {
  const fileName = `${name}/package.json`;
  const json = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  const newJson = { ...json, name };
  fs.writeFileSync(fileName, Buffer.from(JSON.stringify(newJson)));
};
