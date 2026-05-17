const cwd = process.cwd();

module.exports = {
  ...require('@ionic/swiftlint-config'),
  included: [`${cwd}/ios/Plugin`],
  excluded: [
    `${cwd}/.build`,
    `${cwd}/node_modules`,
    `${cwd}/ios/Pods`,
    `${cwd}/example`,
  ],
  disabled_rules: [
    'force_cast',
    'type_body_length',
  ],
};
