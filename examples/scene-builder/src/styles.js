export const colours = {
  controlBackground: '#F5F5F5',
  channelColours: [
    '#22988A',
    '#212449',
    '#C7DAE7',
    '#F4992A',
    '#264B59',
    '#1C1C1B',
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
  title: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
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
