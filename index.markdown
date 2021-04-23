---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults
---
<h2>Posts</h2>
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">
         {{ post.title }}
      </a>
      <span class="post-date">
        {{ post.date | date: "%B %-d, %Y" }}
      </span>
      {{ post.excerpt }}
    </li>
  {% endfor %}
</ul>

<p class="subscribe-link">Subscribe <a href="{{ "/feed.xml" | prepend: site.baseurl }}">via RSS</a></p>
