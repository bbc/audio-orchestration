import mockDocuments from './documents';
import DocumentParser from './../../../src/core/parsers/document-parser';

describe('DocumentParser', function() {
  it('should return without parsing values if no parsers provided', function () {
    const mockDocument = mockDocuments[0];
    const documentParser = new DocumentParser(mockDocument.models);
    const docJson = documentParser.parse(mockDocument.document);

    expect(docJson).toEqual(mockDocument.jsonWithoutParsers);
  });

  it('should correctly parse documents', function () {
    const mockDocument = mockDocuments[0];
    const documentParser = new DocumentParser(
      mockDocument.models, mockDocument.parsers);
    const docJson = documentParser.parse(mockDocument.document);

    expect(docJson).toEqual(mockDocument.json);
  });
});
