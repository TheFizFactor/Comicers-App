import { SettingType } from '@tiyo/common';
import {
  GeneralSetting,
  IntegrationSetting,
  ReaderSetting,
  TrackerSetting,
  SettingTypes,
  ReadingDirection,
  PageStyle,
  OffsetPages,
} from '@/common/models/types';
import persistantStore from '@/renderer/util/persistantStore';
import storeKeys from '@/common/constants/storeKeys.json';

type StoreValues = {
  [key in GeneralSetting | ReaderSetting | TrackerSetting | IntegrationSetting]?: string | null;
};

type Setting = GeneralSetting | ReaderSetting | TrackerSetting | IntegrationSetting;

type SettingEnum =
  | typeof GeneralSetting
  | typeof ReaderSetting
  | typeof TrackerSetting
  | typeof IntegrationSetting;

type SettingValue = string | boolean | number | string[] | null;

type ParsedSettings = {
  [key in Setting]?: SettingValue;
};

const getStoreValues = (storePrefix: string, settingEnum: SettingEnum): StoreValues => {
  const values: StoreValues = {};
  Object.values(settingEnum).forEach((setting: Setting) => {
    values[setting] = persistantStore.read(`${storePrefix}${setting}`);
  });
  return values;
};

const getSettingType = (settingKey: Setting): SettingType | undefined => {
  if (settingKey in SettingTypes) {
    return SettingTypes[settingKey as keyof typeof SettingTypes];
  }
  return undefined;
};

const parseStoreValues = (storeValues: StoreValues): ParsedSettings => {
  const settings: ParsedSettings = {};
  Object.entries(storeValues)
    .filter(([, value]) => value !== null)
    .forEach(([key, value]) => {
      const settingKey = key as Setting;
      const settingType = getSettingType(settingKey);
      
      if (!settingType || !value) return;

      switch (settingType) {
        case SettingType.BOOLEAN:
          settings[settingKey] = value === 'true';
          break;
        case SettingType.STRING:
          settings[settingKey] = value === 'null' ? null : value;
          break;
        case SettingType.STRING_ARRAY:
          settings[settingKey] = value ? value.split(',') : [];
          break;
        case SettingType.NUMBER:
          settings[settingKey] = parseInt(value, 10);
          break;
        default:
          break;
      }
    });
  return settings;
};

export const getAllStoredSettings = () => {
  const settings = {
    ...parseStoreValues(getStoreValues(storeKeys.SETTINGS.GENERAL_PREFIX, GeneralSetting)),
    ...parseStoreValues(getStoreValues(storeKeys.SETTINGS.READER_PREFIX, ReaderSetting)),
    ...parseStoreValues(getStoreValues(storeKeys.SETTINGS.TRACKER_PREFIX, TrackerSetting)),
    ...parseStoreValues(getStoreValues(storeKeys.SETTINGS.INTEGRATION_PREFIX, IntegrationSetting)),
  };

  console.info(`Using settings: ${JSON.stringify(settings)}`);
  return settings;
};

export function saveGeneralSetting(key: GeneralSetting, value: SettingValue) {
  persistantStore.write(`${storeKeys.SETTINGS.GENERAL_PREFIX}${key}`, String(value));
  console.info(`Set GeneralSetting ${key} to ${value}`);
}

export function saveReaderSetting(key: ReaderSetting, value: SettingValue) {
  persistantStore.write(`${storeKeys.SETTINGS.READER_PREFIX}${key}`, String(value));
  console.info(`Set ReaderSetting ${key} to ${value}`);
}

export function saveTrackerSetting(key: TrackerSetting, value: SettingValue) {
  persistantStore.write(`${storeKeys.SETTINGS.TRACKER_PREFIX}${key}`, String(value));
  console.info(`Set TrackerSetting ${key} to ${value}`);
}

export function saveIntegrationSetting(key: IntegrationSetting, value: SettingValue) {
  persistantStore.write(`${storeKeys.SETTINGS.INTEGRATION_PREFIX}${key}`, String(value));
  console.info(`Set IntegrationSetting ${key} to ${value}`);
}

export function nextReadingDirection(readingDirection: ReadingDirection): ReadingDirection {
  return readingDirection === ReadingDirection.LeftToRight
    ? ReadingDirection.RightToLeft
    : ReadingDirection.LeftToRight;
}

export function nextPageStyle(pageStyle: PageStyle): PageStyle {
  return {
    [PageStyle.Single]: PageStyle.Double,
    [PageStyle.Double]: PageStyle.LongStrip,
    [PageStyle.LongStrip]: PageStyle.Single,
  }[pageStyle];
}

export function nextOffsetPages(offsetPages: OffsetPages): OffsetPages {
  return {
    [OffsetPages.All]: OffsetPages.None,
    [OffsetPages.None]: OffsetPages.First,
    [OffsetPages.First]: OffsetPages.All,
  }[offsetPages];
}
