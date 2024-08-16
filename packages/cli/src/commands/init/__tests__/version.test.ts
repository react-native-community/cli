import {createTemplateUri} from '../version';
import type {Options} from '../types';

const mockGetTemplateVersion = jest.fn();

jest.mock('../../../tools/npm', () => ({
  __esModule: true,
  getTemplateVersion: (...args) => mockGetTemplateVersion(...args),
}));

const nullOptions = {} as Options;

describe('createTemplateUri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('for < 0.75', () => {
    it('use react-native for the template', async () => {
      expect(await createTemplateUri(nullOptions, '0.74.1')).toEqual(
        'react-native@0.74.1',
      );
    });
    it('looks DOES NOT use npm registry data to find the template', () => {
      expect(mockGetTemplateVersion).not.toHaveBeenCalled();
    });
  });
  describe('for >= 0.75', () => {
    it('use @react-native-community/template for the template', async () => {
      // Imagine for React Native 0.75.1, template 1.2.3 was prepared for this version
      mockGetTemplateVersion.mockReturnValue('1.2.3');
      expect(await createTemplateUri(nullOptions, '0.75.1')).toEqual(
        '@react-native-community/template@1.2.3',
      );
    });

    it('looks at uses npm registry data to find the matching @react-native-community/template', async () => {
      await createTemplateUri(nullOptions, '0.75.0');
      expect(mockGetTemplateVersion).toHaveBeenCalledWith('0.75.0');
    });
  });
});
