import React from 'react';
import { AboutModal } from '@ohif/ui-next';

function AboutPACSModal() {
  return (
    <AboutModal className="w-[400px]">
      <AboutModal.ProductName>Picture archiving and communication system</AboutModal.ProductName>
      <AboutModal.ProductVersion>2.0</AboutModal.ProductVersion>
      <AboutModal.Body>
        <div className="text-muted-foreground pt-2 text-sm">
          Developed by: Metro-Tech Solutions (U) Limited
        </div>
      </AboutModal.Body>
    </AboutModal>
  );
}

AboutPACSModal.title = 'About PACS';

export default {
  'ohif.aboutModal': AboutPACSModal,
};
