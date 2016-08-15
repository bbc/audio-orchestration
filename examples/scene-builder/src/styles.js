export const colours = {
  controlBackground: '#F5F5F5',
  channelColours: [
    '#FFBBBB',
    '#BBFFBB',
    '#BBBBFF',
    '#FFFFBB',
    '#BBFFFF',
    '#FFBBFF',
    '#FFDDBB',
    '#DDFFBB',
    '#DDBBFF',
    '#FFBBDD',
    '#BBFFDD',
    '#BBDDFF',
  ],
};

export function getChannelColour(number) {
  return colours.channelColours[number % colours.channelColours.length];
}

export function joinStyles(...args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]) {
      Object.assign(result, args[i]);
    }
  }
  return result;
}

export const styles = {
  app: {
    fontFamily: 'sans-serif',
    fontSize: 11,
  },
  title: {
    fontSize: 14,
  },
  button: {
    display: 'inline-block',
    lineHeight: 1.8,
    appearance: 'none',
    boxShadow: 'none',
    borderRadius: 0,
    backgroundColor: colours.controlBackground,
    border: 'none',
  },
  input: {
    padding: 5,
    lineHeight: 2,
    backgroundColor: colours.controlBackground,
    border: 'none',
  },
  select: {
    padding: 5,
    lineHeight: 1.8,
    backgroundColor: colours.controlBackground,
    border: 'none',
  },
  flexbox: {
    display: 'flex',
  },
  flexboxCenter: {
    alignItems: 'center',
  },
  flexboxItemFirst: {
    margin: 0,
  },
  flexboxItem: {
    margin: '0 0 0 4px',
  },
  flexboxColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'flex-start',
  },
  flexboxColumnItem: {
    margin: '4px 0 0 0',
  },
};
