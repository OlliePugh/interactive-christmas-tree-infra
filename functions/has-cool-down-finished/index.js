const hasCoolDownFinished = async ({
  admin,
  action,
  uid,
  boardId,
  modifierCooldown,
}) => {
  const userDocRef = admin.firestore().collection("user-actions").doc(uid);
  await admin.firestore().runTransaction(async (transaction) => {
    const userActionsDoc = await transaction.get(userDocRef);

    if (!userActionsDoc.exists) {
      throw "Document does not exist!";
    }
    console.log("newAction", JSON.stringify(action));
    const sortedActions = userActionsDoc
      .data()
      .actions.filter((act) => act.boardId === boardId); // board ID is 0 for the lights

    const mostRecentAction = sortedActions[sortedActions.length - 1]; // TODO solve this cause this will end up costing a lot
    console.log("mostRecentAction", JSON.stringify(mostRecentAction));

    if (mostRecentAction) {
      // if its not null
      const timeDelta =
        new Date().getTime() -
        new Date(mostRecentAction.time.seconds * 1000).getTime();

      console.log("Time Delta", timeDelta);

      if (timeDelta < modifierCooldown) {
        return Promise.reject("cooldown");
      }
    }

    const changesDocRef = admin.firestore().collection(`board${boardId}`).doc();

    // been over a minute let the user place it again
    console.log("Adding new action to the list of actions");
    await transaction.update(userDocRef, {
      actions: admin.firestore.FieldValue.arrayUnion(action),
    });

    const change = {
      squareId: action.squareId,
      colour: action.colour,
      time: new Date(),
      uid,
    };

    await transaction.set(changesDocRef, change);
  });
};

module.exports = hasCoolDownFinished;
