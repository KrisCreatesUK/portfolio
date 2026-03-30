import { useEffect, useState } from "react";
import { PostCard } from "./Home";

// Featured image
function getPostImage(post) {
  return (
    post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
    "/fallback.jpg"
  );
}

// Category
function getPostCategory(post) {
  return (
    post?._embedded?.["wp:term"]?.[0]?.[0]?.name ||
    "Uncategorised"
  );
}

// Clean excerpt
function getPostExcerpt(post) {
  const raw = post?.excerpt?.rendered || "";
  const clean = raw.replace(/<[^>]+>/g, "").trim();
  return clean.length > 120 ? clean.slice(0, 120) + "..." : clean;
}

// Clean title (remove HTML)
function getPostTitle(post) {
  return (post?.title?.rendered || "").replace(/<[^>]+>/g, "");
}

export default function Thoughts({ onSelect, isTransitioning }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("https://cms.kriscreates.co.uk/wp-json/wp/v2/posts?_embed")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((post) => ({
          ...post,
          image: getPostImage(post),
          categoryName: getPostCategory(post),
          cleanExcerpt: getPostExcerpt(post),
          cleanTitle: getPostTitle(post), // ✅ added
        }));

        setPosts(formatted);
      })
      .catch(console.error);
  }, []);

  return (
    <main className="home thoughts-page">
      <section className="page-section">
        <div className="bg-abstract" />
        <div className="bg-abstract-stripes" />

        <div className="section-inner">
          <div className="section-header">
            <div className="eyebrow">// Thoughts</div>
          </div>

          <div className="project-ribbon ribbon-phase-0">
            {posts.map((post, index) => {
              const staggerClass =
                index % 4 === 0
                  ? "offset-a"
                  : index % 4 === 1
                  ? "offset-b"
                  : index % 4 === 2
                  ? "offset-c"
                  : "offset-d";

              return (
              <PostCard
                key={post.id}
                post={post}
                image={post.image}
                title={post.cleanTitle}
                category={post.categoryName}
                staggerClass={staggerClass}
                onClick={onSelect}
                isTransitioning={isTransitioning}
              />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}