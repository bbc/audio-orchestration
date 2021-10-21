/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import mockDocuments from './documents';
import DocumentParser from '../../../src/core/parsers/document-parser';

describe('DocumentParser', () => {
  it('should return without parsing values if no parsers provided', () => {
    const mockDocument = mockDocuments[0];
    const documentParser = new DocumentParser(mockDocument.models);
    const docJson = documentParser.parse(mockDocument.document);

    expect(docJson).toEqual(mockDocument.jsonWithoutParsers);
  });

  it('should correctly parse documents', () => {
    const mockDocument = mockDocuments[0];
    const documentParser = new DocumentParser(
      mockDocument.models, mockDocument.parsers,
    );
    const docJson = documentParser.parse(mockDocument.document);

    expect(docJson).toEqual(mockDocument.json);
  });
});
