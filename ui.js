$(async function () {
  const $allStoriesList = $("#all-articles-list");
  const $favoritedArticles = $("#favorited-articles");
  const $filteredArticles = $("#filtered-articles");
  const $myArticles = $("#my-articles");
  const $submitForm = $("#submit-form");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navPost = $("#nav-post");
  const $navFavorites = $("#nav-favorites");
  const $navMyStories = $("#nav-my-stories");
  const $profileName = $("#profile-name");
  const $profileUsername = $("#profile-username");
  const $profileAccountDate = $("#profile-account-date");
  const $favoriteIcon = $(".favorite-icon");

  let storyList = null;

  let currentUser = null;

  await checkIfLoggedIn();

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault();

    const username = $("#login-username").val();
    const password = $("#login-password").val();

    const userInstance = await User.login(username, password);

    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    await loginAndSubmitForm();
  });

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault();

    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    await loginAndSubmitForm();
  });

  $submitForm.on("submit", async function (evt) {
    evt.preventDefault();
    const story = {
      author: $("#author").val(),
      title: $("#title").val(),
      url: $("#url").val(),
    };
    await StoryList.addStory(currentUser, story);
    $submitForm.trigger("reset");
    $submitForm.slideToggle();
    await generateStories();
  });
  $navLogOut.on("click", function () {
    localStorage.clear();
    location.reload();
  });

  $navLogin.on("click", function () {
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  $navFavorites.on("click", async function () {
    hideElements();
    await getFavoriteStories();
    $favoritedArticles.show();
  });

  $navMyStories.on("click", async function () {
    hideElements();
    await getMyArticles();
    $myArticles.show();
  });

  $navPost.on("click", function () {
    $submitForm.slideToggle();
  });

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  $("body").on("click", ".favorite-icon", async function (evt) {
    if (!currentUser) {
      $loginForm.slideToggle();
      $createAccountForm.slideToggle();
      $allStoriesList.toggle();
      return;
    }
    if ($(evt.target).hasClass("far")) {
      await currentUser.addFavorite($(evt.target).parent().attr("id"));
      $(evt.target).toggleClass("far").toggleClass("fas");
      return;
    }

    if ($(evt.target).hasClass("fas")) {
      await currentUser.removeFavorite($(evt.target).parent().attr("id"));
      $(evt.target).toggleClass("far").toggleClass("fas");
      return;
    }
  });

  $("body").on("click", ".delete", async function (evt) {
    let deleteId = $(evt.target).parent().attr("id");
    await StoryList.removeStory(currentUser, deleteId);
    $(`#${deleteId}`).remove();
  });

  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();
    if (currentUser) {
      showNavForLoggedInUser(currentUser);
    }
  }

  async function loginAndSubmitForm() {
    $loginForm.hide();
    $createAccountForm.hide();

    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    await generateStories();
    $allStoriesList.show();

    showNavForLoggedInUser(currentUser);
  }

  async function getMyArticles() {
    const user = await User.getLoggedInUser(
      currentUser.loginToken,
      currentUser.username
    );
    $myArticles.empty();
    for (let story of user.ownStories) {
      const result = generateStoryHTML(story);
      $myArticles.append(result);
      $(`#my-articles li#${story.storyId} .favorite-icon`)
        .removeClass("fa-heart")
        .removeClass("far")
        .addClass("fas")
        .addClass("fa-star");
      $("#my-articles li").append('<i class="fas fa-trash-alt delete"></i>');
    }
  }

  async function getFavoriteStories() {
    const user = await User.getLoggedInUser(
      currentUser.loginToken,
      currentUser.username
    );
    $favoritedArticles.empty();
    const ownerStoryIds = getStoryIds(currentUser);
    console.log(ownerStoryIds);

    for (let story of user.favorites) {
      const result = generateStoryHTML(story);
      $favoritedArticles.append(result);
      $(`#favorited-articles li#${story.storyId} .favorite-icon`)
        .removeClass("far")
        .addClass("fas");
      if (ownerStoryIds.includes(story.storyId)) {
        $(`#favorited-articles li#${story.storyId}`).append(
          `<i class="fas fa-trash-alt delete"></i>`
        );
      }
    }
  }

  async function generateStories() {
    const storyListInstance = await StoryList.getStories();

    storyList = storyListInstance;
    $allStoriesList.empty();
    const favoriteIds = getFavoriteIds(currentUser);
    const storyIds = getStoryIds(currentUser);

    buildHTML(storyList, favoriteIds, storyIds);
  }

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="far fa-heart favorite-icon"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong> ${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $favoritedArticles,
      $filteredArticles,
      $myArticles,
      $loginForm,
      $createAccountForm,
    ];
    elementsArr.forEach(($elem) => $elem.hide());
  }

  function showNavForLoggedInUser(user) {
    $navLogin.hide();
    $navPost.show();
    $navFavorites.show();
    $navMyStories.show();
    $navLogOut.show();
    $profileName.html(`Name: ${user.name}`);
    $profileUsername.html(`Username: ${user.username}`);
    const datetimeString = new Date(user.createdAt);
    const date = datetimeString.toString().substring(4, 15);
    $profileAccountDate.html(`Account created: ${date}`);
  }

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  function getFavoriteIds(currentUser) {
    if (currentUser) {
      const favoriteIds = currentUser.favorites.map(
        (favorite) => favorite.storyId
      );
      return favoriteIds;
    }
  }

  function getStoryIds(currentUser) {
    if (currentUser) {
      const storyIds = currentUser.ownStories.map((story) => story.storyId);
      return storyIds;
    }
  }

  function buildHTML(storyList, favoriteIds, userStoryIds) {
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
      if (currentUser) {
        if (favoriteIds.includes(story.storyId)) {
          $(`#all-articles-list li#${story.storyId} .favorite-icon`)
            .removeClass("far")
            .addClass("fas");
        }
        if (userStoryIds.includes(story.storyId)) {
          $(`li#${story.storyId}`).append(
            '<i class="fas fa-trash-alt delete"></i>'
          );
        }
      }
    }
  }
});
