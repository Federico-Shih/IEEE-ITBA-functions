/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


import {NewsItem} from "./models/news.model";
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {logger} from "firebase-functions";

const app = initializeApp();
const firestoreInstance = getFirestore(app);

export const onNewsCreated = onDocumentCreated(
  "blog-entries/{blog}",
  (event) => {
    const createdNews: NewsItem = event.data?.data() as NewsItem;
    const change: any = {
      count: FieldValue.increment(1),
    };
    if (createdNews.listed) {
      change["extra.listedCount"] = FieldValue.increment(1);
    }
    logger.info(`Blog entries changed, listed: ${createdNews.listed}`);
    firestoreInstance
      .collection("collection-metadata")
      .doc("blog-entries")
      .update(change);
  });

export const onNewsChanged = onDocumentUpdated(
  "blog-entries/{blog}",
  (event) => {
    const {listed: prevListed}: NewsItem =
      event.data?.before.data() as NewsItem;
    const {listed: postListed}: NewsItem =
      event.data?.after.data() as NewsItem;
    if (prevListed !== postListed) {
      firestoreInstance
        .collection("collection-metadata")
        .doc("blog-entries")
        .update({
          ["extra.listedCount"]: FieldValue.increment((postListed) ? 1 : -1),
        });
    }
  });

export const onNewsDeleted = onDocumentDeleted(
  "blog-entries/{blog}",
  (event) => {
    const {listed}: NewsItem = event.data?.data() as NewsItem;
    const change: any = {
      count: FieldValue.increment(-1),
    };
    if (listed) {
      change["extra.listedCount"] = FieldValue.increment(-1);
    }
    firestoreInstance
      .collection("collection-metadata")
      .doc("blog-entries")
      .update(change);
  });

// Start writing functions
// https://firebase.google.com/docs/functions/typescript
