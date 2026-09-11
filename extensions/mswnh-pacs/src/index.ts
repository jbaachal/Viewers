import { Types } from '@ohif/core';

import { id } from './id';
import getPanelModule from './getPanelModule';
import getCustomizationModule from './getCustomizationModule';

export * from './dashboard/models';
export * from './dashboard/services';

const mswnhPacsExtension: Types.Extensions.Extension = {
  id,

  getPanelModule,
  getCustomizationModule,
};

export default mswnhPacsExtension;
