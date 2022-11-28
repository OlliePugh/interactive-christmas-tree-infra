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

    const mostRecentAction = sortedActions[sortedActions.length - 1];
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

    // been over a minute let the user place it again
    console.log("Adding new action to the list of actions");
    await transaction.update(userDocRef, {
      actions: admin.firestore.FieldValue.arrayUnion(action),
    });
  });
};

module.exports = hasCoolDownFinished;
