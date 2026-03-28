# CRAM – Project Proposal

**C**ollaborative **R**esource for **A**cademic **M**aterials

A collaborative wiki-style knowledge base for University of Manitoba courses.

## Quick Links
- [Meeting Minutes](documents/meeting-minutes/)
- [Conventions and test plans](documents/)
- [Architecture diagrams](diagrams/)
- [Acceptance Tests](documents/acceptance-tests.pdf)

## Project Vision & Summary

CRAM is a collaboratively edited platform for the University of Manitoba. It allows students to build and maintain course-specific knowledge, with each course having dedicated pages for shared notes and definitions. While this is available across many resources, it is often fragmented and verbose. CRAM provides the tools and structure to consolidate this information into a shared knowledge base, allowing students to focus on what matters most rather than searching for it.

## Core Functional Features

CRAM has five core functional features to drive its success. This includes the ability to authenticate an account through a University of Manitoba email, prepopulate the website with each course within the academic year to provide a baseline, modularize each course to establish an intuitive architecture, and run global searches on courses, notes and discussions.

### 1. Account Creation

Users may sign-up with their University of Manitoba email as a student or professor.

### 2. Course Provisioning

- Courses in the Academic Calendar will have their own page through provisioning
- Course pages inherit their prerequisites and descriptions from the course catalog
- Courses have a navigational bar with **Notes** and **Dictionary** sections

### 3. Section Management

Users can edit the course page and dictionary:

- Create
- Read
- Update
- Delete

### 4. Global Search

- Search bar functionality (contextual to the page the user is on)
- Linking words from a course page to the course dictionary

### 5. Profile Management

- Users can set and change their username
- Users can reset their password
- Users are assigned a role based on the email they used (student or professor)
- Users can see their contribution history

## Running with Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shivambhagat20/CRAM.git
   cd CRAM
   ```

2. **Create environment files**

   Create `backend/.env` with the required environment variables:
   ```
   MONGO_URI=<MongoDB connection string>
   JWT_SECRET=<JWT secret key>
   SESSION_SECRET=<session secret key>
   NODE_ENV=development
   FRONTEND_URL=http://localhost:8080
   EMAIL_USER=<email address>
   EMAIL_PASS=<email app password>
   ```

   Create an empty `frontend/.env`:
   ```bash
   touch frontend/.env
   ```

3. **Pull and run the containers**
   ```bash
   docker-compose pull
   docker-compose up
   ```

4. **Open the app**

   Navigate to [http://localhost:8080](http://localhost:8080) in your browser.

## Technologies

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, MongoDB
- **Authentication:** Sessions-based, Argon2
- **Routing:** React Router
- **HTTP:** Fetch API
- **CI/CD:** GitHub Actions, Docker

## User Stories

### Account Creation

*“**As a** student, **I want** to create an account using my University of Manitoba email **so that** I can securely access the platform with my institutional email.”*

#### Acceptance Criteria

- Given I am on the registration page, when I enter an email address that does not belong to the University of Manitoba, then I should be prevented from creating an account.
- Given I am on the registration page, when I enter a valid University of Manitoba email address and a valid password, then my account should be created successfully.
  
#### *Priority: High*

### Course Provisioning

*“**As a** student or contributor, **I want** every officially offered course to already have a baseline course page **so that** collaborative notes and discussions can begin immediately.”*

#### Acceptance Criteria

- Given I am on the landing page, when the page loads, then I should be able to view all courses offered in the academic year.
- Given I am on the landing page, when I click a course, then it should expand to show course-specific details found on the course catalog. 
- Given I am on the landing page, when I click on a course title or a “Go to Course” button, then I should be redirected to the course page.
- Given I am on a course page, when I open the sidebar, then I should be able to see links to the course details, course notes, and the course definitions.
- Given I am on the course page, when I click on a shortcut link, then I should be redirected to that section.

#### *Priority: High*

### Section Management

*“**As a** course contributor, **I want** to organize a course into structured sections or units **so that** notes and examples are grouped in a clear and intuitive hierarchy.”*

#### Acceptance Criteria

- Given I am on a course notes page, when I am logged in, when I click “Add Section”, then I should be able to add sections.
- Given I am on a course notes page, when I am logged in, when I click “Edit Section”, then I should be able to modify the notes.
- Given I am on a course notes page, when I am logged in, when I click “Delete Section”, then I should be able to delete sections.
- Given I am on a course notes page, when I am not logged in, then I can only read the notes but not modify them in any way.

#### *Priority: High.*

### Global Search

*“**As a** student, **I want** to search across courses, sections, and discussions **so that** I can quickly locate relevant definitions, examples, or answers without manually browsing each course.”*

#### Acceptance Criteria

- Given I am on the landing page, when I click the search bar, then I should be able to type what I would like to find.
- Given I am on the landing page, when I have entered my search query and clicked the submit button, then I should see the relevant search results.
- Given I am on a course page, when I have entered a keyword or subject into the search bar and clicked submit, then I should see any sections, notes, or definitions related to that keyword that exist on the course page.

#### *Priority: Medium*

### Profile Manager

*“**As a** user, **I want** to be able to view and edit my profile **so that** I can manage my account and understand my participation on the platform.”*

#### Acceptance Criteria

- Given I am on the login page, when I click on “Forget Password,” then I should be prompted to enter my registered email address.
- Given I provide a valid registered email, when I click “Submit,” then I should receive a reset link in my email.
- Given that I receive a reset link, when I click on it, then I should be redirected to the website to set a new password.
- Given I set a new valid password, then my password should be updated, and I should be able to log in with the new one.
- Given that I am on my profile page, when I click “Contribution History,” then I should see a list of my past contributions.

#### *Priority: Low*
