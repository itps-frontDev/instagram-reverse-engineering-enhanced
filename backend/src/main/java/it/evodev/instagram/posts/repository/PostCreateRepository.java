package it.evodev.instagram.posts.repository;

import it.evodev.instagram.posts.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCreateRepository extends JpaRepository<Post, Long> {}
