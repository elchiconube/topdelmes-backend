const { getRandomDelay, msToTime } = require("./helper");

const runServicesInSequence = async (services) => {
  while (true) {
    for (const service of services) {
      console.log(`Starting ${service.name}...`);
      await service.service();
      console.log(`Finished ${service.name}.`);

      const delay = getRandomDelay();
      console.log(`Waiting for ${msToTime(delay)} before starting next service.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const runUpdates = async (updateFunction, updateName, isDaily = true) => {
  console.log(`Starting ${updateName}...`);
  await updateFunction();
  console.log(`Finished ${updateName}.`);

  const delay = getRandomDelay(isDaily);
  console.log(`Waiting for ${msToTime(delay)} before starting next ${updateName}.`);
  setTimeout(() => runUpdates(updateFunction, updateName, isDaily), delay);
};

module.exports = {
  runServicesInSequence,
  runUpdates
};
