export const workshop = {
  // Put your participants here!
  // Note: This key cannot be used inside templateData, because templateData gets flattened with `this`
  participants: ['Joren', 'Felix', 'Alex'],
  admins: ['Joren'],
  adminPassword: 'pineapples',
  appKey: '(=]#bYS940q)T8S*dX1g;Sey)X3YhN|98B>4hwE:c2ew8QrN3);hQN?x"5#yUS',
  title: 'Frontend Workshop',

  // Put your data here to be used inside your scaffolding template files
  templateData: {
    appTitle: 'Cool Frontend App',

    // It is possible to have dynamic data where you can run JS that returns a String
    participantNameLowercase() {
      // participantName is a special value that represents the name of the current participant
      // that we are scaffolding files for.
      return this.participantName.toLowerCase();
    },

    intro() {
      // participantName is a special value that represents the name of the current participant
      // that we are scaffolding files for.
      return `Hi ${this.participantName}, welcome to ${this.appTitle}!`;
    },
  },
};
