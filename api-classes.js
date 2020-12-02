const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);

    const stories = response.data.stories.map((story) => new Story(story));

    const storyList = new StoryList(stories);
    return storyList;
  }

  static async addStory(user, newStory) {
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {
        token: user.loginToken,
        story: newStory,
      },
    });
    const newUserStory = new Story(response.data.story);
    return newUserStory;
  }

  static async removeStory(user, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: user.loginToken,
      },
    });
    $(`#${storyId}`).remove();
  }
}

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name,
      },
    });

    const newUser = new User(response.data.user);

    newUser.loginToken = response.data.token;

    return newUser;
  }

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password,
      },
    });

    const existingUser = new User(response.data.user);

    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );

    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  static async getLoggedInUser(token, username) {
    if (!token || !username) return null;

    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token,
      },
    });

    const existingUser = new User(response.data.user);

    existingUser.loginToken = token;

    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );
    return existingUser;
  }

  async toggleFavorites(storyId, method) {
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: method,
      data: {
        token: this.loginToken,
      },
    });
  }

  async addFavorite(storyId) {
    await this.toggleFavorites(storyId, "POST");

    const serverUser = await this.constructor.getLoggedInUser(
      this.loginToken,
      this.username
    );
    this.favorites = serverUser.favorites;
    console.log(this.favorites);
  }

  async removeFavorite(storyId) {
    await this.toggleFavorites(storyId, "DELETE");

    const serverUser = await this.constructor.getLoggedInUser(
      this.loginToken,
      this.username
    );
    this.favorites = serverUser.favorites;
    console.log(this.favorites);
  }
}

class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}
