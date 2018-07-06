import xml.parsers.expat
import argparse
import os

TEMPLATE = '''<?xml version="1.0" encoding="utf-8"?>
<MPD
  type="static" xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:dvb:dash:profile:dvb-dash:2014,urn:dvb:dash:profile:dvb-dash:isoff-ext-live:2014"
  minBufferTime="{minBufferTime}"
  mediaPresentationDuration="{duration}"
  maxSegmentDuration="{maxSegmentDuration}"
>
  <BaseURL>{baseURL}</BaseURL>
  <Period start="{periodStart}" duration="{duration}">
    <AdaptationSet id="{adaptationSetId}" contentType="audio" segmentAlignment="true" mimeType="audio/mp4">
      <Representation id="0" mimeType="audio/mp4" codecs="{representationCodecs}" bandwidth="{representationBandwidth}" audioSamplingRate="{representationAudioSamplingRate}" />
      <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="{audioChannelConfigurationValue}" />
      <SegmentTemplate timescale="{segmentTimescale}" duration="{segmentDuration}" initialization="{segmentInitialization}" media="{segmentMedia}" startNumber="{segmentStartNumber}" />
    </AdaptationSet>
  </Period>
</MPD>
'''

def manifestPaths(base):
    for root, dirs, files in os.walk(base):
        for filename in files:
            if os.path.splitext(filename)[1] == '.mpd':
                yield os.path.abspath(os.path.join(root, filename))

def fixManifest(path, baseURL):
    print(baseURL)
    variables = {
        'baseURL': baseURL,
        'maxSegmentDuration': 'PT1S',
        'minBufferTime': 'PT1S',
        'duration': 'PT0M0S',
        'periodStart': 'PT0M0S',
        'representationBandwidth': '',
        'representationCodecs': '',
        'representationAudioSamplingRate': '',
        'adaptationSetId': 'id',
        'segmentTimescale': '48000',
        'segmentDuration': '0',
        'segmentInitialization': '',
        'segmentMedia': '',
        'segmentStartNumber': '1',
        'audioChannelConfigurationValue': '1'
    }

    def startElement(name, attrs):
        if name == 'MPD':
            variables['minBufferTime'] = attrs.get('minBufferTime')
            variables['maxSegmentDuration'] = attrs.get('maxSegmentDuration')
            variables['duration'] = attrs.get('mediaPresentationDuration')
        elif name == 'Period':
            variables['periodStart'] = attrs.get('start')
        elif name == 'Representation':
            variables['representationBandwidth'] = attrs.get('bandwidth')
            variables['representationCodecs'] = attrs.get('codecs')
            variables['representationAudioSamplingRate'] = attrs.get('audioSamplingRate')
        elif name == 'AdaptationSet':
            variables['adaptationSetId'] = attrs.get('id')
        elif name == 'SegmentTemplate':
            variables['segmentTimescale'] = attrs.get('timescale')
            variables['segmentDuration'] = attrs.get('duration')
            variables['segmentInitialization'] = attrs.get('initialization')
            variables['segmentMedia'] = attrs.get('media')
            variables['segmentStartNumber'] = attrs.get('startNumber')
        elif name == 'AudioChannelConfiguration':
            variables['audioChannelConfigurationValue'] = attrs.get('value')

    p = xml.parsers.expat.ParserCreate()
    p.StartElementHandler = startElement
    with open(path, 'rb') as f:
        p.ParseFile(f)

    outputPath = path + '.fixed'
    with open(outputPath, 'w+') as f:
        f.write(TEMPLATE.format(**variables))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input_path', help='path to encoded audio')
    parser.add_argument('--baseURL', default='/audio/')
    args = parser.parse_args()

    for path in manifestPaths(args.input_path):
        print(path)
        relPath = os.path.dirname(path[len(os.path.abspath(args.input_path)) + 1:])
        fixManifest(path, args.baseURL + relPath + '/')

