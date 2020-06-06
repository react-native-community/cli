import * as CLI from '../index';

describe('cli index', () => {
  it('exports AssetUtils with the expected function names', () => {
    expect(CLI.AssetUtils.filterPlatformAssetScales).toBeDefined();
    expect(CLI.AssetUtils.getAndroidAssetSuffix).toBeDefined();
    expect(CLI.AssetUtils.getAndroidResourceFolderName).toBeDefined();
    expect(CLI.AssetUtils.getAndroidResourceIdentifier).toBeDefined();
    expect(CLI.AssetUtils.getAssetDestPathAndroid).toBeDefined();
    expect(CLI.AssetUtils.getAssetDestPathIOS).toBeDefined();
    expect(CLI.AssetUtils.getBasePath).toBeDefined();
  });
});
