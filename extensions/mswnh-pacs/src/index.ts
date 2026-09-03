import { Types } from '@ohif/core';

import { id } from './id';
import getPanelModule from './getPanelModule';

const mswnhPacsExtension: Types.Extensions.Extension = {
  id,

  getPanelModule,
};

export default mswnhPacsExtension;