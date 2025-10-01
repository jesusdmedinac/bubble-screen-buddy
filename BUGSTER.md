# Generating and managing tests

> How to create, modify, and remove tests in Bugster.

Generating tests in Bugster is simple and flexible. You can auto-generate tests across your entire app for quick coverage, manually craft precise test scenarios, or use AI assistance to write and refine tests. Once created, tests are easy to edit and delete as your application evolves.

In this guide you will learn:

1. [How to generate tests](#1-generate-tests-3-ways)
2. [The required test morphology](#2-test-morphology-in-bugster)
3. [How to edit any test field and validate changes](#3-editing-an-existing-test)
4. [How to delete tests](#4-deleting-tests)

<Card title="Prerequisites">
  * Bugster CLI installed and authenticated.
  * Run commands from your repo root (same folder containing `/.bugster/`).
  * Your app runs locally (if you plan to validate with `bugster run`).
</Card>

## 1. Generate tests (3 ways)

Bugster supports **three** creation modes:

| If you want to…                  | Use                           | Why                                           |
| :------------------------------- | :---------------------------- | :-------------------------------------------- |
| Seed broad coverage fast         | Automatic `bugster generate`  | Highest coverage per minute                   |
| Generate targeted scenarios      | `bugster generate --prompt`   | AI-guided generation with custom focus        |
| Capture a very specific scenario | Manual YAML                   | Full control over task/steps/expected\_result |
| Write/refine with an AI editor   | Assisted (Claude Code/Cursor) | Faster authoring, inline edits                |

### 1.1 Automatic (bulk) — `bugster generate`

Bugster can **propose and create** many tests across your app or for specific pages.

**Commands:**

```bash
# Bulk auto-generation (across some pages)
bugster generate

# Generate for specific pages (using source file paths)
bugster generate --page path/to/page.tsx path/to/another/page.tsx

# Generate N tests distributed across pages
bugster generate --count 10

# Combine: 13 tests for a specific page
bugster generate --count 13 --page path/to/page.tsx

# Generate with custom AI guidance (requires --page)
bugster generate --page path/to/page.tsx --prompt "Focus on edge cases and error handling"

# Combine count, page, and custom prompt
bugster generate --count 5 --page path/to/page.tsx --prompt "Test form validation and user input scenarios"
```

* **Pros:** fast, broad initial coverage, zero overhead, customizable with `--prompt` for targeted scenarios.
* **Cons:** if you need a **very specific** use case, it might not appear on the first pass (complement with a manual test or use `--prompt` for guidance).

### 1.2 Manual (YAML template)

For **precise** scenarios, create your own test explicitly.

**Requirements:**

1. **Content:** follow the **YAML morphology** (see next section).
2. **File:** place it under the Bugster tests folder, mirroring your app’s **filesystem hierarchy**.

<Info>
  `page` = route (e.g., `/dashboard/users`)\
  `page_path` = source file path (e.g., `app/dashboard/users/page.tsx`)
</Info>

**Suggested template (copy/paste):**

```yaml
name: User details page navigation
page: /dashboard/users
page_path: app/dashboard/users/page.tsx
task: Navigate from users list to a specific user's details page
steps:
- Navigate to the dashboard users page
- Click on a specific user from the list
- Verify that the user is redirected to the user details page
- Verify that the user details are displayed correctly
expected_result: User should be redirected to the specific user's details page
```

**Run your manual test to validate it:**

```bash
bugster run relative_path_to_my_test.yaml
```

### 1.3 Assisted (Claude Code / Cursor)

Use AI coding assistants like Cursor or Claude to generate Bugster-compliant test specifications with intelligent guidance.

**Advantages:**

* **AI-powered**: Intelligent test scenario generation
* **Compliant**: Follows Bugster YAML structure when properly configured
* **Fast**: Quicker than manual YAML writing
* **Guided**: Built-in best practices and validation

<Info>
  See the [Cursor Integration guide](/guides/coding-agents/cursor) for complete setup instructions and usage patterns.
</Info>

## 2. Test morphology in Bugster

> Definition: the minimal structure Bugster expects in a test.

```yaml
name: Title of the test
page: Main page path of the test in /folder/subfolder format, e.g. "/dashboard/users"
page_path: Source path of the page, e.g. app/dashboard/users/page.tsx
credential_id (optional): The credential/role/permission you want Bugster to use.
task: The goal the test must achieve
steps:
- General or specific steps
- What you want the agent to do to achieve the task
- Because there can be multiple paths to the same goal
expected_result: What the agent should verify to confirm the goal was achieved
```

<Check>
  **Test quality checklist:**

  * **One clear task** per test (avoid multi-goals).
  * **Steps are actionable** (verbs first) and ordered.
  * **`expected_result` is observable** (URL change, element visible, text equals).
</Check>

Here's an example of a good vs. a bad `expected_result`:

<CodeGroup>
  ```yaml ❌ Vague
  expected_result: The page works
  ```

  ```yaml ✅ Observable
  expected_result: The URL includes "/users/123" and an element with text "User details" is visible
  ```
</CodeGroup>

**Example:**

```yaml
name: User details page navigation
page: /dashboard/users
page_path: app/dashboard/users/page.tsx
task: Navigate from users list to a specific user's details page
steps:
- Navigate to the dashboard users page
- Click on a specific user from the list
- Verify that the user is redirected to the user details page
- Verify that the user details are displayed correctly
expected_result: User should be redirected to the specific user's details page
```

## 3. Editing an existing test

You can **edit** any Bugster-generated (or user-created) test, as long as you keep the YAML **morphology** (`name`, `page`, `page_path`, `task`, `steps`, `expected_result`).

* Rename the **test** for team clarity.
* Adjust the **task** to be more precise.
* Add/remove **steps** to better guide the agent.
* Update the **expected\_result** if the verification changes.

**Before/after example:**

<Tabs>
  <Tab title="Old">
    ```yaml
    name: User details page navigation
    page: /dashboard/users
    page_path: app/dashboard/users/page.tsx
    task: Navigate from users list to a specific user's details page
    steps:
    - Navigate to the dashboard users page
    - Click on a specific user from the list
    - Verify that the user is redirected to the user details page
    - Verify that the user details are displayed correctly
    expected_result: User should be redirected to the specific user's details page
    ```
  </Tab>

  <Tab title="New">
    ```yaml
    name: User details view
    page: /dashboard/users
    page_path: app/dashboard/users/page.tsx
    task: Navigate from users list to any user's details page
    steps:
    - Navigate to the dashboard users page
    - Click on any user from the list
    - Verify that the user is redirected to the user details page
    expected_result: User should be redirected to any user's details page
    ```
  </Tab>
</Tabs>

<Tip>
  Recommendation: run the test again to confirm the changes are honored:

  ```bash
  bugster run relative_path_to_my_test.yaml
  ```
</Tip>

## 4. Deleting tests

You can **delete** any test with no restrictions:

* **Single file:** remove the test file.
* **Batch:** delete a **folder** under `.bugster/tests/...` to remove all tests beneath it.

<Info>
  This does not disrupt Bugster’s functionality or your workflows.
</Info>

## 5. File location and naming conventions

* Bugster tests folder: `/.bugster/tests/`
* **Hierarchy:** mirror your app structure (based on `page_path`).

**Mapping example:**

If your test declares `page_path: app/dashboard/users/page.tsx`, the recommended location is:

```
.bugster/tests/dashboard/users/test.yaml
```

**File naming:**

* use **snake\_case**, lowercase, descriptive.
* If `name: Navigation back to home from about page`, the recommended file name is:

  ```
  navigation_back_to_home_from_about_page.yaml
  ```
