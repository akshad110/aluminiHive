// Import all models in the correct order to ensure proper registration
// This file ensures models are registered before any queries are executed

import "./User";
import "./Batch";
import "./BatchChat";
import "./Alumni";
import "./Student";
import "./Activity";
import "./MentorshipRequest";
import "./MentorSession";
import "./VideoCallSession";
import "./JobPosting";
import "./Message";
import "./ConnectionRequest";
import "./MessageLimit";
import "./Subscription";
import "./PerAlumniMessageLimit";
import "./AlumniSubscription";
import "./QuarterlySubscription";
import "./JobPostingSubscription";

// Re-export all models for convenience
export { User } from "./User";
export { Batch } from "./Batch";
export { BatchChatMessage } from "./BatchChat";
export { Alumni } from "./Alumni";
export { Student } from "./Student";
export { Activity } from "./Activity";
export { MentorshipRequest } from "./MentorshipRequest";
export { MentorSession } from "./MentorSession";
export { VideoCallSession } from "./VideoCallSession";
export { JobPosting } from "./JobPosting";
export { Message } from "./Message";
export { ConnectionRequest } from "./ConnectionRequest";
export { MessageLimit } from "./MessageLimit";
export { Subscription } from "./Subscription";
export { PerAlumniMessageLimit } from "./PerAlumniMessageLimit";
export { AlumniSubscription } from "./AlumniSubscription";
export { QuarterlySubscription } from "./QuarterlySubscription";
export { JobPostingSubscription } from "./JobPostingSubscription";
